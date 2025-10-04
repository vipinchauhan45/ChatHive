import { BrowserRouter, Routes, Route } from "react-router-dom"
import ChatPage from "./chatPage"
function App() {

  return (
    <BrowserRouter>
        <Routes>
          <Route index element={<ChatPage/>}></Route>
        </Routes>
    </BrowserRouter>
  )
}

export default App
