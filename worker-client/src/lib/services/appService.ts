import { workerApi } from "../axios"



export const getCategories = async () => workerApi.get('/categories')