"use client";
import Board from "@/components/WhiteBoard/Board/BoardComp";
import Menu from "@/components/WhiteBoard/Menu/MenuComp";
import Toolbox from "@/components/WhiteBoard/Toolbox/ToolComp";
import { store } from "@/config/store";
import React from "react";
import { Provider } from "react-redux";

const whiteBoard = () => {
  return (
    <Provider store={store}>
      <div className="flex flex-col  w-screen">
        <Menu />
        <Toolbox />
        <Board />
      </div>
    </Provider>
  );
};

export default whiteBoard;
