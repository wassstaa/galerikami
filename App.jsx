import React from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Home from './components/Home.jsx'
import Photobooth from './components/Photobooth.jsx'
import BlurMode from './components/BlurMode.jsx'
import Polaroid from './components/Polaroid.jsx'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/photobooth" element={<Photobooth />} />
        <Route path="/blur" element={<BlurMode />} />
        <Route path="/polaroid" element={<Polaroid />} />
      </Routes>
    </HashRouter>
  )
}
