import { redirect } from "next/navigation";
import axios from 'axios';

export default async function WhiteboardIndexPage() {
  // get a room id  or create new by requesting from backend and redirecting to that roomID canvs 
  
  const response = await axios.post('/api/whiteboard/create');
  
  redirect(`/whiteboard/${response.data?.id}`);
}