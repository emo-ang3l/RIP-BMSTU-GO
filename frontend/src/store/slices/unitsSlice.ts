// src/slices/filterSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import type { RootState } from "../store";

interface FilterState {
  search: string;
  minPrice: string;
  maxPrice: string;
}

const initialState: FilterState = {
  search: "",
  minPrice: "",
  maxPrice: "",
};

const filterSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    setMinPrice(state, action: PayloadAction<string>) {
      state.minPrice = action.payload;
    },
    setMaxPrice(state, action: PayloadAction<string>) {
      state.maxPrice = action.payload;
    },
    clearFilters() {
      return initialState;
    },
  },
});

export const { setSearch, setMinPrice, setMaxPrice, clearFilters } = filterSlice.actions;

export const useFilters = () =>
  useSelector((state: RootState) => state.filters);

export default filterSlice.reducer;