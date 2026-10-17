import "dotenv/config";
import mongoose from "mongoose";
import { User } from "./src/models/User.js";
import { Recipe } from "./src/models/Recipe.js";

const AYUSH_EMAIL = "ayushchdry2004.apsb@gmail.com";
const SUMIT_EMAIL = "sumitkumarpoddar74@gmail.com";
const AYUSH_RECIPE_COUNT = 13;

const recipes = [
  {
    title: "Creamy Tuscan Tomato Pasta",
    slug: "creamy-tuscan-tomato-pasta",
    description:
      "A quick, silky tomato pasta with spinach, garlic, and a little parmesan.",
    content:
      "A weeknight-friendly pasta with bright tomatoes and a creamy finish.",
    image:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=1200&auto=format&fit=crop&q=85",
    authorName: "Poodiest Test Kitchen",
    category: "Dinner",
    tags: ["pasta", "vegetarian", "weeknight"],
    prepTime: "10 mins",
    cookTime: "20 mins",
    servings: 4,
    ingredients: [
      { amount: "350 g", item: "Penne pasta" },
      { amount: "2 tbsp", item: "Olive oil" },
      { amount: "3 cloves", item: "Garlic, minced" },
      { amount: "400 g", item: "Cherry tomatoes, halved" },
      { amount: "100 g", item: "Baby spinach" },
      { amount: "120 ml", item: "Heavy cream" },
      { amount: "40 g", item: "Parmesan, grated" },
    ],
    steps: [
      "Cook the pasta in salted water until al dente. Reserve a mug of pasta water, then drain.",
      "Warm the olive oil in a large pan. Add the garlic and tomatoes and cook until the tomatoes soften.",
      "Stir in the spinach and cream. Simmer until the spinach wilts, then fold in the parmesan.",
      "Toss the pasta through the sauce, loosening it with pasta water as needed. Season and serve.",
    ],
    published: true,
  },
  {
    title: "Herby Lemon Chickpea Salad",
    slug: "herby-lemon-chickpea-salad",
    description:
      "A crisp, filling chickpea salad tossed with herbs, cucumber, and lemon dressing.",
    content:
      "Make this refreshing salad ahead for easy lunches or a colorful side dish.",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&auto=format&fit=crop&q=85",
    authorName: "Poodiest Test Kitchen",
    category: "Salad",
    tags: ["chickpeas", "vegetarian", "lunch"],
    prepTime: "15 mins",
    cookTime: "0 mins",
    servings: 4,
    ingredients: [
      { amount: "2 cans", item: "Chickpeas, drained and rinsed" },
      { amount: "1", item: "Cucumber, diced" },
      { amount: "200 g", item: "Cherry tomatoes, halved" },
      { amount: "1/2", item: "Red onion, finely sliced" },
      { amount: "1/2 cup", item: "Fresh parsley, chopped" },
      { amount: "3 tbsp", item: "Olive oil" },
      { amount: "1", item: "Lemon, juiced" },
    ],
    steps: [
      "Add the chickpeas, cucumber, tomatoes, onion, and parsley to a large bowl.",
      "Whisk the olive oil and lemon juice with a pinch of salt and black pepper.",
      "Pour the dressing over the salad and toss well. Rest for 10 minutes before serving.",
    ],
    published: true,
  },
  {
    title: "Skillet Margherita Pizza",
    slug: "skillet-margherita-pizza",
    description:
      "A golden, crisp-edged skillet pizza topped with tomato, mozzarella, and basil.",
    content:
      "A simple stovetop-to-oven method makes homemade pizza easy on a busy night.",
    image:
      "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=1200&auto=format&fit=crop&q=85",
    authorName: "Poodiest Test Kitchen",
    category: "Dinner",
    tags: ["pizza", "vegetarian", "italian"],
    prepTime: "20 mins",
    cookTime: "15 mins",
    servings: 2,
    ingredients: [
      { amount: "1", item: "Prepared pizza dough" },
      { amount: "120 g", item: "Tomato passata" },
      { amount: "150 g", item: "Fresh mozzarella, torn" },
      { amount: "1 tbsp", item: "Olive oil" },
      { amount: "1/4 cup", item: "Fresh basil leaves" },
      { amount: "1/2 tsp", item: "Dried oregano" },
    ],
    steps: [
      "Heat the oven to 240 C. Stretch the dough to fit a lightly oiled oven-safe skillet.",
      "Spread the passata over the dough, leaving a small border. Add mozzarella and oregano.",
      "Cook on the stove over medium heat until the base begins to turn golden, about 4 minutes.",
      "Transfer the skillet to the oven and bake until bubbling. Finish with basil before slicing.",
    ],
    published: true,
  },
  {
    title: "Fluffy Blueberry Pancakes",
    slug: "fluffy-blueberry-pancakes",
    description:
      "Soft, golden pancakes packed with blueberries and finished with maple syrup.",
    content:
      "A dependable weekend breakfast made with pantry staples and fresh berries.",
    image:
      "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=1200&auto=format&fit=crop&q=85",
    authorName: "Poodiest Test Kitchen",
    category: "Breakfast",
    tags: ["pancakes", "blueberry", "brunch"],
    prepTime: "10 mins",
    cookTime: "15 mins",
    servings: 4,
    ingredients: [
      { amount: "200 g", item: "Plain flour" },
      { amount: "2 tbsp", item: "Sugar" },
      { amount: "2 tsp", item: "Baking powder" },
      { amount: "1", item: "Egg" },
      { amount: "250 ml", item: "Milk" },
      { amount: "150 g", item: "Blueberries" },
      { amount: "2 tbsp", item: "Butter, melted" },
    ],
    steps: [
      "Whisk the flour, sugar, and baking powder together in a mixing bowl.",
      "Whisk the egg, milk, and melted butter in a second bowl, then stir into the dry ingredients.",
      "Fold in the blueberries. Cook small ladles of batter on a lightly buttered pan until bubbles form.",
      "Flip and cook until golden. Serve warm with maple syrup.",
    ],
    published: true,
  },
  {
    title: "Coconut Red Lentil Curry",
    slug: "coconut-red-lentil-curry",
    description:
      "Comforting red lentils simmered with coconut milk, ginger, and warming spices.",
    content:
      "This one-pot curry is rich, gently spiced, and especially good with steamed rice.",
    image:
      "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=1200&auto=format&fit=crop&q=85",
    authorName: "Poodiest Test Kitchen",
    category: "Dinner",
    tags: ["lentils", "vegan", "curry"],
    prepTime: "10 mins",
    cookTime: "30 mins",
    servings: 4,
    ingredients: [
      { amount: "250 g", item: "Red lentils, rinsed" },
      { amount: "1", item: "Onion, diced" },
      { amount: "2 cloves", item: "Garlic, minced" },
      { amount: "1 tbsp", item: "Fresh ginger, grated" },
      { amount: "1 tbsp", item: "Curry powder" },
      { amount: "400 ml", item: "Coconut milk" },
      { amount: "500 ml", item: "Vegetable stock" },
    ],
    steps: [
      "Cook the onion in a splash of oil until soft. Add the garlic, ginger, and curry powder.",
      "Stir in the lentils, coconut milk, and vegetable stock.",
      "Bring to a gentle simmer and cook for 25 to 30 minutes, stirring occasionally, until tender.",
      "Season to taste and serve with rice or flatbread.",
    ],
    published: true,
  },
  {
    title: "Roasted Tomato Basil Soup",
    slug: "roasted-tomato-basil-soup",
    description:
      "Sweet roasted tomatoes blended into a smooth soup with garlic and fresh basil.",
    content:
      "Roasting brings out the tomatoes' sweetness and gives this classic soup extra depth.",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&auto=format&fit=crop&q=85",
    authorName: "Poodiest Test Kitchen",
    category: "Lunch",
    tags: ["soup", "tomato", "vegetarian"],
    prepTime: "10 mins",
    cookTime: "40 mins",
    servings: 4,
    ingredients: [
      { amount: "1 kg", item: "Ripe tomatoes, halved" },
      { amount: "1", item: "Red onion, quartered" },
      { amount: "4 cloves", item: "Garlic, unpeeled" },
      { amount: "2 tbsp", item: "Olive oil" },
      { amount: "500 ml", item: "Vegetable stock" },
      { amount: "1/2 cup", item: "Fresh basil leaves" },
      { amount: "2 tbsp", item: "Cream, optional" },
    ],
    steps: [
      "Heat the oven to 200 C. Arrange tomatoes, onion, and garlic on a tray and drizzle with olive oil.",
      "Roast for 30 minutes until soft and lightly caramelized.",
      "Squeeze the garlic from its skins and blend the roasted vegetables with stock and basil.",
      "Warm gently, season to taste, and finish with cream if desired.",
    ],
    published: true,
  },
  {
    title: "Sesame Ginger Salmon Bowls",
    slug: "sesame-ginger-salmon-bowls",
    description:
      "Glazed salmon served over rice with crunchy vegetables and sesame seeds.",
    content:
      "A balanced bowl with savory-sweet salmon, crisp vegetables, and a bright ginger dressing.",
    image:
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200&auto=format&fit=crop&q=85",
    authorName: "Poodiest Test Kitchen",
    category: "Dinner",
    tags: ["salmon", "rice bowl", "high protein"],
    prepTime: "15 mins",
    cookTime: "15 mins",
    servings: 2,
    ingredients: [
      { amount: "2", item: "Salmon fillets" },
      { amount: "2 tbsp", item: "Soy sauce" },
      { amount: "1 tbsp", item: "Honey" },
      { amount: "1 tsp", item: "Fresh ginger, grated" },
      { amount: "300 g", item: "Cooked rice" },
      { amount: "1", item: "Carrot, ribboned" },
      { amount: "1 tbsp", item: "Sesame seeds" },
    ],
    steps: [
      "Mix the soy sauce, honey, and ginger. Brush half over the salmon.",
      "Bake at 200 C for 12 to 15 minutes, brushing once with the remaining glaze.",
      "Divide the rice between bowls and add the carrot and any other desired vegetables.",
      "Top with salmon and sesame seeds, then serve warm.",
    ],
    published: true,
  },
  {
    title: "Smoky Black Bean Tacos",
    slug: "smoky-black-bean-tacos",
    description:
      "Quick black bean tacos with smoky spices, crunchy slaw, and lime.",
    content:
      "A flexible meat-free taco night built from cupboard staples and fresh toppings.",
    image:
      "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=1200&auto=format&fit=crop&q=85",
    authorName: "Poodiest Test Kitchen",
    category: "Dinner",
    tags: ["tacos", "black beans", "vegan"],
    prepTime: "15 mins",
    cookTime: "10 mins",
    servings: 4,
    ingredients: [
      { amount: "2 cans", item: "Black beans, drained" },
      { amount: "1 tsp", item: "Smoked paprika" },
      { amount: "1 tsp", item: "Ground cumin" },
      { amount: "8", item: "Small corn tortillas" },
      { amount: "2 cups", item: "Shredded cabbage" },
      { amount: "1", item: "Lime" },
      { amount: "1", item: "Avocado, sliced" },
    ],
    steps: [
      "Warm the beans in a pan with paprika, cumin, a splash of water, and a pinch of salt.",
      "Toss the cabbage with lime juice and a little salt.",
      "Warm the tortillas in a dry pan until soft and lightly toasted.",
      "Fill the tortillas with beans, slaw, and avocado. Serve with extra lime.",
    ],
    published: true,
  },
  {
    title: "One-Pan Garlic Butter Chicken",
    slug: "one-pan-garlic-butter-chicken",
    description:
      "Juicy chicken and green beans cooked in a simple garlic butter pan sauce.",
    content:
      "A practical one-pan dinner with a savory sauce that is perfect over potatoes or rice.",
    image:
      "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=1200&auto=format&fit=crop&q=85",
    authorName: "Poodiest Test Kitchen",
    category: "Dinner",
    tags: ["chicken", "one pan", "weeknight"],
    prepTime: "10 mins",
    cookTime: "25 mins",
    servings: 4,
    ingredients: [
      { amount: "4", item: "Boneless chicken thighs" },
      { amount: "300 g", item: "Green beans, trimmed" },
      { amount: "3 tbsp", item: "Butter" },
      { amount: "4 cloves", item: "Garlic, minced" },
      { amount: "150 ml", item: "Chicken stock" },
      { amount: "1 tbsp", item: "Lemon juice" },
      { amount: "2 tbsp", item: "Fresh parsley, chopped" },
    ],
    steps: [
      "Season the chicken with salt and pepper. Sear in a hot skillet until browned on both sides.",
      "Add the butter and garlic and cook briefly until fragrant.",
      "Pour in the stock, add the green beans, cover, and simmer until the chicken is cooked through.",
      "Stir in the lemon juice and parsley. Spoon the pan sauce over the chicken to serve.",
    ],
    published: true,
  },
  {
    title: "Dark Chocolate Fudge Brownies",
    slug: "dark-chocolate-fudge-brownies",
    description:
      "Rich, chewy brownies with a crackly top and plenty of dark chocolate.",
    content:
      "These easy brownies are best cooled fully before cutting into neat squares.",
    image:
      "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=1200&auto=format&fit=crop&q=85",
    authorName: "Poodiest Test Kitchen",
    category: "Dessert",
    tags: ["chocolate", "baking", "dessert"],
    prepTime: "15 mins",
    cookTime: "25 mins",
    servings: 9,
    ingredients: [
      { amount: "180 g", item: "Dark chocolate, chopped" },
      { amount: "120 g", item: "Butter" },
      { amount: "180 g", item: "Sugar" },
      { amount: "2", item: "Eggs" },
      { amount: "80 g", item: "Plain flour" },
      { amount: "25 g", item: "Cocoa powder" },
      { amount: "1/4 tsp", item: "Salt" },
    ],
    steps: [
      "Heat the oven to 175 C and line a small square baking tin with parchment.",
      "Melt the chocolate and butter together, then whisk in the sugar.",
      "Beat in the eggs one at a time. Fold in the flour, cocoa, and salt until just combined.",
      "Spread the batter in the tin and bake for 22 to 25 minutes. Cool before slicing.",
    ],
    published: true,
  },
  {
    title: "Spinach and Feta Stuffed Peppers",
    slug: "spinach-feta-stuffed-peppers",
    description:
      "Sweet bell peppers filled with rice, spinach, herbs, and tangy feta.",
    content:
      "A colorful vegetarian main that works well for meal prep or a relaxed dinner.",
    image:
      "https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?w=1200&auto=format&fit=crop&q=85",
    authorName: "Poodiest Test Kitchen",
    category: "Dinner",
    tags: ["vegetarian", "peppers", "feta"],
    prepTime: "15 mins",
    cookTime: "35 mins",
    servings: 4,
    ingredients: [
      { amount: "4", item: "Bell peppers, halved and seeded" },
      { amount: "200 g", item: "Cooked rice" },
      { amount: "100 g", item: "Baby spinach" },
      { amount: "100 g", item: "Feta, crumbled" },
      { amount: "1", item: "Small red onion, diced" },
    ],
    steps: [
      "Heat the oven to 190 C and place the pepper halves in a baking dish.",
      "Wilt the spinach in a pan, then mix with rice, onion, and half the feta.",
      "Fill the pepper halves and bake for 30 to 35 minutes until tender.",
      "Scatter over the remaining feta and serve warm.",
    ],
    published: true,
  },
  {
    title: "Garlic Sesame Noodles",
    slug: "garlic-sesame-noodles",
    description:
      "Glossy noodles tossed with garlic, sesame, soy, and fresh scallions.",
    content:
      "A quick pantry-friendly noodle bowl that is easy to customize with vegetables.",
    image:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200&auto=format&fit=crop&q=85",
    authorName: "Poodiest Test Kitchen",
    category: "Asian",
    tags: ["noodles", "quick", "vegetarian"],
    prepTime: "10 mins",
    cookTime: "10 mins",
    servings: 4,
    ingredients: [
      { amount: "350 g", item: "Wheat noodles" },
      { amount: "3 cloves", item: "Garlic, finely chopped" },
      { amount: "3 tbsp", item: "Soy sauce" },
      { amount: "1 tbsp", item: "Sesame oil" },
      { amount: "1 tbsp", item: "Honey" },
      { amount: "2", item: "Scallions, sliced" },
    ],
    steps: [
      "Cook the noodles according to the package directions and drain.",
      "Warm sesame oil in a pan and cook the garlic briefly until fragrant.",
      "Stir in soy sauce and honey, then toss through the noodles.",
      "Top with scallions and sesame seeds before serving.",
    ],
    published: true,
  },
  {
    title: "Mango Coconut Overnight Oats",
    slug: "mango-coconut-overnight-oats",
    description:
      "Creamy make-ahead oats layered with ripe mango and toasted coconut.",
    content:
      "Prepare these oats the night before for a cool, simple breakfast.",
    image:
      "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=1200&auto=format&fit=crop&q=85",
    authorName: "Poodiest Test Kitchen",
    category: "Breakfast",
    tags: ["oats", "mango", "make ahead"],
    prepTime: "10 mins",
    cookTime: "0 mins",
    servings: 2,
    ingredients: [
      { amount: "100 g", item: "Rolled oats" },
      { amount: "200 ml", item: "Milk" },
      { amount: "100 g", item: "Plain yogurt" },
      { amount: "1 tbsp", item: "Chia seeds" },
      { amount: "1", item: "Ripe mango, diced" },
      { amount: "2 tbsp", item: "Toasted coconut" },
    ],
    steps: [
      "Stir the oats, milk, yogurt, and chia seeds together in a covered container.",
      "Refrigerate overnight or for at least 6 hours.",
      "Top with diced mango and toasted coconut just before serving.",
    ],
    published: true,
  },
  {
    title: "Crispy Parmesan Cauliflower Bites",
    slug: "crispy-parmesan-cauliflower-bites",
    description:
      "Oven-roasted cauliflower with a crisp parmesan and breadcrumb coating.",
    content: "Serve these golden bites as a snack or an easy vegetable side.",
    image:
      "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=1200&auto=format&fit=crop&q=85",
    authorName: "Poodiest Test Kitchen",
    category: "Vegetarian",
    tags: ["cauliflower", "snack", "vegetarian"],
    prepTime: "15 mins",
    cookTime: "25 mins",
    servings: 4,
    ingredients: [
      { amount: "1 large", item: "Cauliflower, cut into florets" },
      { amount: "80 g", item: "Breadcrumbs" },
      { amount: "50 g", item: "Parmesan, finely grated" },
      { amount: "2", item: "Eggs, beaten" },
      { amount: "1 tsp", item: "Paprika" },
    ],
    steps: [
      "Heat the oven to 220 C and line a baking tray with parchment.",
      "Mix breadcrumbs, parmesan, and paprika in a shallow bowl.",
      "Dip cauliflower florets in egg, coat in crumbs, and arrange on the tray.",
      "Bake for 20 to 25 minutes, turning once, until crisp and golden.",
    ],
    published: true,
  },
  {
    title: "Pesto Chicken Orzo",
    slug: "pesto-chicken-orzo",
    description:
      "Tender chicken and orzo simmered together with basil pesto and tomatoes.",
    content: "A bright one-pan dinner finished with parmesan and fresh basil.",
    image:
      "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=1200&auto=format&fit=crop&q=85",
    authorName: "Poodiest Test Kitchen",
    category: "Dinner",
    tags: ["chicken", "orzo", "one pan"],
    prepTime: "10 mins",
    cookTime: "25 mins",
    servings: 4,
    ingredients: [
      { amount: "500 g", item: "Chicken breast, diced" },
      { amount: "250 g", item: "Orzo" },
      { amount: "2 tbsp", item: "Basil pesto" },
      { amount: "700 ml", item: "Chicken stock" },
      { amount: "200 g", item: "Cherry tomatoes" },
      { amount: "30 g", item: "Parmesan, grated" },
    ],
    steps: [
      "Brown the chicken in a deep pan with a little oil, then stir in the orzo.",
      "Add the stock and tomatoes. Simmer, stirring often, until the orzo is tender.",
      "Stir through the pesto and parmesan. Season and serve hot.",
    ],
    published: true,
  },
  {
    title: "Apple Cinnamon Breakfast Muffins",
    slug: "apple-cinnamon-breakfast-muffins",
    description:
      "Soft apple muffins scented with cinnamon and finished with a crisp oat top.",
    content:
      "A lightly sweet bake for breakfast, lunchboxes, or an afternoon snack.",
    image:
      "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=1200&auto=format&fit=crop&q=85",
    authorName: "Poodiest Test Kitchen",
    category: "Breakfast",
    tags: ["apple", "muffins", "baking"],
    prepTime: "15 mins",
    cookTime: "22 mins",
    servings: 12,
    ingredients: [
      { amount: "220 g", item: "Plain flour" },
      { amount: "2", item: "Apples, peeled and diced" },
      { amount: "100 g", item: "Brown sugar" },
      { amount: "1", item: "Egg" },
      { amount: "180 ml", item: "Milk" },
      { amount: "1 tsp", item: "Ground cinnamon" },
      { amount: "2 tsp", item: "Baking powder" },
    ],
    steps: [
      "Heat the oven to 180 C and line a 12-cup muffin tin.",
      "Mix flour, sugar, cinnamon, and baking powder in a large bowl.",
      "Whisk egg and milk, fold into the dry ingredients, then add the apples.",
      "Divide into the tin and bake for about 22 minutes until risen and golden.",
    ],
    published: true,
  },
  {
    title: "Coconut Lime Shrimp Stir-Fry",
    slug: "coconut-lime-shrimp-stir-fry",
    description:
      "Juicy shrimp and crisp vegetables tossed in a zesty coconut-lime sauce.",
    content:
      "A fast skillet meal with plenty of lime and a gentle coconut finish.",
    image:
      "https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=1200&auto=format&fit=crop&q=85",
    authorName: "Poodiest Test Kitchen",
    category: "Seafood",
    tags: ["shrimp", "seafood", "quick"],
    prepTime: "15 mins",
    cookTime: "10 mins",
    servings: 4,
    ingredients: [
      { amount: "500 g", item: "Raw shrimp, peeled" },
      { amount: "1", item: "Red bell pepper, sliced" },
      { amount: "200 ml", item: "Coconut milk" },
      { amount: "1", item: "Lime, zested and juiced" },
      { amount: "2 cloves", item: "Garlic, minced" },
      { amount: "2 tbsp", item: "Fresh coriander, chopped" },
    ],
    steps: [
      "Sear the shrimp in a hot skillet for 1 to 2 minutes per side, then set aside.",
      "Cook the bell pepper and garlic until just tender.",
      "Add coconut milk, lime zest, and lime juice. Simmer briefly to thicken.",
      "Return the shrimp to the pan, warm through, and finish with coriander.",
    ],
    published: true,
  },
  {
    title: "Mushroom and Pea Risotto",
    slug: "mushroom-pea-risotto",
    description:
      "Creamy arborio rice with browned mushrooms, sweet peas, and parmesan.",
    content:
      "A patient stir makes this comforting risotto rich and velvety without cream.",
    image:
      "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=1200&auto=format&fit=crop&q=85",
    authorName: "Poodiest Test Kitchen",
    category: "Dinner",
    tags: ["risotto", "mushroom", "vegetarian"],
    prepTime: "10 mins",
    cookTime: "30 mins",
    servings: 4,
    ingredients: [
      { amount: "300 g", item: "Arborio rice" },
      { amount: "250 g", item: "Mushrooms, sliced" },
      { amount: "1", item: "Small onion, finely diced" },
      { amount: "1 litre", item: "Warm vegetable stock" },
      { amount: "100 g", item: "Frozen peas" },
      { amount: "50 g", item: "Parmesan, grated" },
    ],
    steps: [
      "Brown the mushrooms in a wide pan, then set aside.",
      "Soften the onion, add the rice, and stir for one minute.",
      "Add warm stock a ladle at a time, stirring until absorbed before adding more.",
      "When the rice is creamy and tender, fold in peas, mushrooms, and parmesan.",
    ],
    published: true,
  },
  {
    title: "Cilantro Lime Quinoa Bowls",
    slug: "cilantro-lime-quinoa-bowls",
    description:
      "Fluffy quinoa bowls with black beans, avocado, corn, and lime dressing.",
    content:
      "A fresh, filling bowl that can be served warm or packed for lunch.",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&auto=format&fit=crop&q=85",
    authorName: "Poodiest Test Kitchen",
    category: "Lunch",
    tags: ["quinoa", "vegetarian", "meal prep"],
    prepTime: "15 mins",
    cookTime: "20 mins",
    servings: 4,
    ingredients: [
      { amount: "200 g", item: "Quinoa, rinsed" },
      { amount: "1 can", item: "Black beans, drained" },
      { amount: "150 g", item: "Sweetcorn" },
      { amount: "1", item: "Avocado, sliced" },
      { amount: "1", item: "Lime, juiced" },
      { amount: "1/3 cup", item: "Fresh coriander, chopped" },
    ],
    steps: [
      "Cook quinoa in salted water according to the package directions, then fluff with a fork.",
      "Warm the black beans and corn together in a small pan.",
      "Toss quinoa with lime juice and chopped coriander.",
      "Divide into bowls and top with beans, corn, and avocado.",
    ],
    published: true,
  },
  {
    title: "Strawberry Yogurt Parfaits",
    slug: "strawberry-yogurt-parfaits",
    description:
      "Layers of creamy yogurt, fresh strawberries, honey, and crunchy granola.",
    content:
      "An easy breakfast or dessert assembled in minutes with seasonal berries.",
    image:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=1200&auto=format&fit=crop&q=85",
    authorName: "Poodiest Test Kitchen",
    category: "Desserts",
    tags: ["strawberry", "yogurt", "breakfast"],
    prepTime: "10 mins",
    cookTime: "0 mins",
    servings: 4,
    ingredients: [
      { amount: "500 g", item: "Greek yogurt" },
      { amount: "300 g", item: "Strawberries, sliced" },
      { amount: "120 g", item: "Granola" },
      { amount: "2 tbsp", item: "Honey" },
      { amount: "1 tsp", item: "Vanilla extract" },
    ],
    steps: [
      "Stir vanilla into the yogurt.",
      "Layer yogurt, strawberries, and granola in four glasses.",
      "Drizzle with honey and serve straight away to keep the granola crisp.",
    ],
    published: true,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const users = await User.find({
      email: { $in: [AYUSH_EMAIL, SUMIT_EMAIL] },
    });
    const usersByEmail = new Map(users.map((user) => [user.email, user]));
    const ayush = usersByEmail.get(AYUSH_EMAIL);
    const sumit = usersByEmail.get(SUMIT_EMAIL);

    if (!ayush || !sumit) {
      const missingEmails = [
        !ayush && AYUSH_EMAIL,
        !sumit && SUMIT_EMAIL,
      ].filter(Boolean);
      throw new Error(
        `Create these user accounts before seeding recipes: ${missingEmails.join(", ")}`
      );
    }

    const result = await Recipe.bulkWrite(
      recipes.map((recipe, index) => {
        const owner = index < AYUSH_RECIPE_COUNT ? ayush : sumit;
        const recipeData = { ...recipe };
        delete recipeData.authorName;

        return {
          updateOne: {
            filter: { slug: recipe.slug },
            update: {
              $set: {
                author: owner._id,
                authorName: owner.name?.trim() || owner.username,
              },
              $setOnInsert: recipeData,
            },
            upsert: true,
          },
        };
      })
    );

    console.log(
      `Seed complete: inserted ${result.upsertedCount} recipes; ${AYUSH_RECIPE_COUNT} assigned to ${AYUSH_EMAIL} and ${recipes.length - AYUSH_RECIPE_COUNT} assigned to ${SUMIT_EMAIL}.`
    );
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

await seed();
