const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/categories`;

export async function getCategories() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  return response.json();
}