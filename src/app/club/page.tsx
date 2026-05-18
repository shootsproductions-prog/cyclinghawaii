import { redirect } from "next/navigation";

// /club was the original home of The Roster + Wall + Manifesto, but as
// of the launch restructure the homepage IS the club — those sections
// now live at /. We permanent-redirect /club so old links, social posts,
// and bookmarks keep working without ever rendering a duplicate page.
export default function ClubPage() {
  redirect("/");
}
