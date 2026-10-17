import { Link } from "react-router-dom";

function CategoryCard({ category }) {
  return (
    <div className="category-card">
      <h3>{category.category_name}</h3>

      <Link
        to={`/products?category=${encodeURIComponent(
          category.category_name
        )}`}
        className="category-button"
      >
        View Products
      </Link>
    </div>
  );
}

export default CategoryCard;