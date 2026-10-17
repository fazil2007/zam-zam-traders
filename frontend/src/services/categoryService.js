const API_URL = "http://localhost:5000/api/categories";

export async function getCategories() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  return response.json();
}