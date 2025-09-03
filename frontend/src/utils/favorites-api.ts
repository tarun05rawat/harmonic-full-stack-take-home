import { buildApiUrl } from "../config/api";

export async function toggleFavorite(
  favoritesListId: string,
  companyId: number,
  liked: boolean
) {
  const res = await fetch(buildApiUrl("/favorites/toggle"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      favorites_list_id: favoritesListId,
      company_id: companyId,
      liked: liked,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as { company_id: number; liked: boolean };
}
