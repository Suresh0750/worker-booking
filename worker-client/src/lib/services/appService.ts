import { ApiResponse, ICategory } from "@/types"
import { workerApi } from "../axios"
import { AxiosResponse } from "axios"



export const getCategories = (): Promise<AxiosResponse<ApiResponse<ICategory[]>>> => 
    workerApi.get('/categories')
