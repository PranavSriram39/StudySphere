import { configureStore } from "@reduxjs/toolkit";
import MenuReducer from '../components/WhiteBoard/slice/menuSlice'
import ToolboxReducer from '../components/WhiteBoard/slice/toolboxSlice'

export const store = configureStore({
    reducer:{
        menu : MenuReducer,
        tool : ToolboxReducer
    }
})