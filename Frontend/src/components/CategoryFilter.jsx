const CategoryFilter = ({ setCategory }) => {
  const categories = ['top', 'technology', 'world', 'business', 'sports', 'health'];

  return (
    <div style={{ marginBottom: '20px' }}>
      {categories.map(cat => (
        <button key={cat} onClick={() => setCategory(cat)} style={{ marginRight: '10px' }}>
          {cat.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
