import React, { useEffect, useState, useRef, Fragment } from 'react'
import io from 'socket.io-client'
import Peer from 'simple-peer'
import './App.css'

const socket = io('http://localhost:8000')

function App() {
  const [ streams, setStreams ]             = useState([])
  const [ remoteStreams, setRemoteStreams ] = useState({})
  const streamsRef                          = useRef()
  const remoteStreamsRef                    = useRef()
  const { current: peers }                  = useRef({})

  // initialize streamsRefs to match states on each render
  streamsRef.current = streams
  remoteStreamsRef.current = remoteStreams

  // create peer connection for socket
  function initPeer(id, initiator = false) {
    const peer = new Peer({
      initiator,
      trickle: false,
      streams: streamsRef.current
    })

    peer.on('signal', data => {
      socket.emit('signal', { to: id, data })
    })

    peer.on('stream', stream => {
      setRemoteStreams(prevStreams => {
        const socketStreams = prevStreams[id] || []
        return { ...prevStreams, [id]: [...socketStreams, stream] }
      })
    })

    peer.on('close', () => {
      delete peers[id]
      setRemoteStreams(prevStreams => {
        delete prevStreams[id]
        return Object.assign({}, prevStreams)
       }
      )
    })

    peers[id] = peer
  }

  function addLocalStream(stream) {
    setStreams(prevStreams => [...prevStreams, stream])
    Object.values(peers).forEach(peer => peer.addStream(stream))
  }

  async function getStream() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    addLocalStream(stream)
  }

  async function activateScreenshare() {
    const stream = await navigator.mediaDevices.getDisplayMedia()
    addLocalStream(stream)
  }
  
  // component mount effect
  useEffect(() => {
    // TODO: add dynamic rooms
    socket.emit('join', 1) // join room 1

    // add socket event listeners
    socket.on('join', id => {
      initPeer(id, true)
      socket.emit('join-answer', id)
    })
    socket.on('join-answer', id => initPeer(id))
    socket.on('signal', ({ from, data }) => peers[from].signal(data))

    // initialize video stream
    getStream()
  }, [])

  // render
  return <Fragment>
    <header>
      <button onClick={ activateScreenshare }>Activate screen share</button>
    </header>
    <main className='App'>
      { streams && streams.map(stream => <Video key={stream.id} stream={stream}/>) }
      { Object.values(remoteStreams).map(streams => 
          streams.map(stream => <Video key={stream.id} stream={stream}/>)) }
    </main>
  </Fragment>
}


// Video component

function Video({ stream }) {
  const ref = useRef()

  // update video ref when stream changes
  useEffect(() => {
    ref.current.srcObject = stream
  }, [stream])

  return <video ref={ref} autoPlay />
}

export default App
