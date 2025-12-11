import type{Request , Response} from 'express'
import { NewUser } from '../schema/user.schema'

const Register = async(req:Request , res:Response)=>{
    const body = req.body
    const data = NewUser.safeParse(body)

    
}