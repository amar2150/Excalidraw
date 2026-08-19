import React from 'react'
import Toolbar from './Components/Toolbar';
import CanvasBoard from './Components/CanvasBoard';
import { useState } from 'react';
import { useEffect } from 'react';
import { io } from "socket.io-client";
import axios from './api/axios.jsx';
const App = () => {
  const [tool, setTool] = useState("select");
  const [socket, setSocket] = useState(null);
  const [boardId, setBoardId] = useState("");
  // const [board, setBoard] = useState([]);
  const [elements, setElements] = useState([]);
  const [title, setTitle] = useState("");


  let SOCKET_URL = "http://localhost:4444";

  useEffect(() => {
    let s = io(SOCKET_URL);
    setSocket(s)

    return () => s.disconnect();
  }, []);

  useEffect(()=>{
    if(!socket) return;
    const handleBoardInit = (payload) => {
      // console.log("board-init", payload);
      // isApplyingRemoteUpdate.current = true;
      if (payload._id) setBoardId(payload._id);
      if (payload.title) setTitle(payload.title);
      if (Array.isArray(payload.elements)) setElements(payload.elements);
      // isApplyingRemoteUpdate.current = false;
    };
    const handleElementsUpdate = ({ elements }) => {
      // isApplyingRemoteUpdate.current = true;
      setElements(elements);
      // isApplyingRemoteUpdate.current = false;
    };
    const handleBoardError = (payload) => {
      console.error("board-error:", payload);
    };

    socket.on("board-init", handleBoardInit);
    socket.on("elements-update", handleElementsUpdate);
    socket.on("board-error", handleBoardError);
  },[socket])

  useEffect(() => {
    if(!socket ) return;
    socket.emit("elements-update", { boardId, elements });
      
    return () => {
      socket.off("element-update");
      };
  }, [socket, elements]);

  useEffect (() => {
    if(!socket) return;
    socket.on("elements-update", ({ elements }) => {
      setElements(elements);
    });
  }, [ socket, elements])

  useEffect(()=>{
    if(!socket) return;//iske bina multiple board banege 
    const initBoard = async () => {
      //it will give you current url
      const url = new URL(window.location.href);
      let idFromUrl = url.searchParams.get("boardId");
      let board = null;
      // console.log(idFromUrl)
      if(idFromUrl){
        let {data} = await axios.get(`http://localhost:4444/api/boards/getBoard/${idFromUrl}`);
        // console.log(data);
         board = data;
         setTitle(board.title);
         setBoardId(board._id);
         setElements(board.elements);

      } else {
        let {data} = await axios.post(`http://localHost:4444/api/boards/createBoard`, {
          title: "demo-board",
        });
        board = data;
        setTitle(board.title);
        setBoardId(board._id);
        setElements(board.elements);
        url.searchParams.set("boardId", board._id);
        window.history.replaceState({}, "", url);
      }
      // console.log(board);
    };
    initBoard();
    }, [socket]);

    useEffect(() => {
      if (!boardId) return;
        socket.emit("join-board",{boardId}, (msg) => {
          if(!msg.ok){
            alert(msg.message);
          }
          console.log(msg);
        });
    },[socket, boardId]);

  return (
    <div>
    <div>{title} - {boardId ? boardId : 'connecting.........'}</div>
      <Toolbar activeTool={tool} setActiveTool={setTool} />
      <CanvasBoard 
      elements={elements} 
      setElements={setElements} 
      boardId={boardId}
      tool={tool}
      />
    </div>
  )
}

export default App
