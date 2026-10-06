import { Link } from "react-router-dom";
import { EmptyState } from "../components/States.jsx";

export default function NotFound() {
  return <div className="container"><EmptyState title="Page not found" text="The page you're looking for doesn't exist." action={<Link className="btn btn-dark" to="/">Back to home</Link>} /></div>;
}
