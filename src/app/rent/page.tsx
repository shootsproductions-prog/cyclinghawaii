import { redirect } from "next/navigation";

// /rent is a punchy short-URL alias for the /rentals directory.
// Canonical URL stays /rentals for SEO (plural noun matches how
// directory-style pages typically index in search), but this redirect
// keeps cyclinghawaii.com/rent working as a shareable short URL when
// someone types it or hears it read out loud.
export default function RentAlias() {
  redirect("/rentals");
}
