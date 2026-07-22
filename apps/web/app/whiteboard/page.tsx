import { redirect } from "next/navigation";

// /whiteboard used to be a second, near-identical boards dashboard sitting
// beside /rooms — same create form, same list, a different set of bugs. There
// is one dashboard now; this route only exists so old links and the Navbar's
// "Whiteboards" entry still land somewhere sensible.
export default function WhiteboardIndexPage() {
    redirect("/rooms");
}
