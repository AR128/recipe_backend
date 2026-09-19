/**
 * Seed script — populate the database with sample recipes.
 * Run with: node src/seed.js
 */
import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import "dotenv/config";
import mongoose from "mongoose";
import { Admin } from "./models/Admin.js";
import { Recipe } from "./models/Recipe.js";

const MONGODB_URI = process.env.MONGODB_URI;

const recipes = [
  {
    title: "Spicy Tomato Pasta",
    slug: "spicy-tomato-pasta",
    description:
      "A fiery Italian-inspired pasta bursting with ripe tomatoes, garlic, chilli flakes and fresh basil — ready in just 30 minutes.",
    content: `This classic pasta dish is all about bold, simple flavours. Slow-simmering the tomatoes with garlic and a generous pinch of chilli flakes creates a sauce that clings beautifully to every strand of spaghetti. Finish with a shower of fresh basil and a drizzle of your best olive oil for a weeknight dinner that feels restaurant-worthy.`,
    image:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80",
    category: "Dinner",
    tags: ["pasta", "italian", "spicy", "vegetarian"],
    cookTime: "20 mins",
    prepTime: "10 mins",
    servings: 4,
    ingredients: [
      { amount: "400g", item: "spaghetti" },
      { amount: "800g", item: "canned crushed tomatoes" },
      { amount: "4 cloves", item: "garlic, thinly sliced" },
      { amount: "1 tsp", item: "red chilli flakes" },
      { amount: "4 tbsp", item: "extra-virgin olive oil" },
      { amount: "1 handful", item: "fresh basil leaves" },
      { amount: "to taste", item: "salt and black pepper" },
      { amount: "50g", item: "Parmesan, finely grated (optional)" },
    ],
    steps: [
      "Bring a large pot of well-salted water to a rolling boil.",
      "Heat olive oil in a wide pan over medium heat. Add garlic and chilli flakes; cook 1–2 minutes until fragrant but not browned.",
      "Add crushed tomatoes. Season generously. Simmer on medium-low for 15 minutes, stirring occasionally.",
      "Cook spaghetti according to package directions until al dente. Reserve 1 cup pasta water before draining.",
      "Add drained pasta to the sauce. Toss well, adding a splash of pasta water to loosen.",
      "Remove from heat. Tear in basil, toss once more, and serve topped with Parmesan if desired.",
    ],
    published: true,
  },
  {
    title: "Avocado Toast with Poached Egg",
    slug: "avocado-toast-poached-egg",
    description:
      "Silky smashed avocado on perfectly toasted sourdough, crowned with a runny poached egg and chilli flakes. Brunch perfection in 15 minutes.",
    content: `The secret to great avocado toast is twofold: ripe avocados and good bread. Choose sourdough with a sturdy crumb that can hold the weight of the toppings without going soggy. A squeeze of fresh lemon and a pinch of flaky sea salt lift the whole dish. The poached egg adds richness and protein, making this a satisfying breakfast or light lunch.`,
    image:
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80",
    category: "Breakfast",
    tags: ["brunch", "avocado", "eggs", "quick"],
    cookTime: "8 mins",
    prepTime: "7 mins",
    servings: 2,
    ingredients: [
      { amount: "2 slices", item: "thick sourdough bread" },
      { amount: "2", item: "ripe avocados" },
      { amount: "2", item: "large eggs" },
      { amount: "1", item: "lemon, juiced" },
      { amount: "½ tsp", item: "red chilli flakes" },
      { amount: "1 splash", item: "white wine vinegar" },
      { amount: "to taste", item: "flaky sea salt and black pepper" },
      { amount: "optional", item: "microgreens or rocket to serve" },
    ],
    steps: [
      "Toast the sourdough until golden and crisp.",
      "Halve avocados, remove stones, scoop flesh into a bowl. Add lemon juice, salt and pepper. Mash roughly with a fork — leave some texture.",
      "Bring a deep saucepan of water to a gentle simmer. Add vinegar. Create a gentle whirlpool with a spoon.",
      "Crack an egg into a small cup. Slip it into the centre of the whirlpool. Cook 3–4 minutes for a runny yolk. Remove with a slotted spoon.",
      "Spread smashed avocado generously over toast. Top with the poached egg.",
      "Sprinkle with chilli flakes, extra sea salt and microgreens. Serve immediately.",
    ],
    published: true,
  },
  {
    title: "Blueberry Ricotta Pancakes",
    slug: "blueberry-ricotta-pancakes",
    description:
      "Fluffy, cloud-like pancakes made with creamy ricotta and packed with fresh blueberries. Drizzle with maple syrup for the ultimate weekend breakfast.",
    content: `Adding ricotta to pancake batter is a game-changer — it creates an incredibly light, fluffy texture that regular pancakes simply can't match. The fresh blueberries burst in the pan, creating little pockets of jammy sweetness. These pancakes are best served immediately, stacked high with a generous pour of pure maple syrup.`,
    image:
      "https://images.unsplash.com/photo-1528207776546-3221976a1611?w=800&q=80",
    category: "Breakfast",
    tags: ["pancakes", "blueberry", "ricotta", "brunch", "sweet"],
    cookTime: "20 mins",
    prepTime: "10 mins",
    servings: 4,
    ingredients: [
      { amount: "250g", item: "ricotta cheese" },
      { amount: "3", item: "eggs, separated" },
      { amount: "120ml", item: "whole milk" },
      { amount: "150g", item: "plain flour" },
      { amount: "2 tsp", item: "baking powder" },
      { amount: "2 tbsp", item: "caster sugar" },
      { amount: "1 tsp", item: "vanilla extract" },
      { amount: "150g", item: "fresh blueberries" },
      { amount: "pinch", item: "salt" },
      { amount: "to serve", item: "maple syrup and butter" },
    ],
    steps: [
      "In a large bowl, whisk together ricotta, egg yolks, milk and vanilla until smooth.",
      "Sift in flour, baking powder, sugar and salt. Stir until just combined — do not overmix.",
      "In a separate bowl, whisk egg whites to stiff peaks. Gently fold into batter in three additions.",
      "Fold in blueberries.",
      "Heat a non-stick pan over medium-low heat with a little butter. Drop ¼ cup portions of batter. Cook until bubbles form on top and edges look set, about 3 minutes. Flip and cook 2 minutes more.",
      "Serve immediately, stacked with extra blueberries, butter and maple syrup.",
    ],
    published: true,
  },
  {
    title: "Classic Margherita Pizza",
    slug: "classic-margherita-pizza",
    description:
      "Authentic Neapolitan-style pizza with a crispy charred base, vibrant San Marzano tomato sauce, fresh mozzarella and fragrant basil.",
    content: `True Margherita pizza is an exercise in restraint — every ingredient matters. The sauce is nothing more than crushed San Marzano tomatoes seasoned with salt. The mozzarella should be fresh and well-drained. And the basil goes on fresh after baking. Get those three things right and you have something extraordinary. A very hot oven (or better yet, a pizza stone) is essential for that signature blistered crust.`,
    image:
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80",
    category: "Dinner",
    tags: ["pizza", "italian", "vegetarian", "classic"],
    cookTime: "12 mins",
    prepTime: "90 mins",
    servings: 2,
    ingredients: [
      { amount: "280g", item: "00 flour (plus extra for dusting)" },
      { amount: "7g", item: "instant dried yeast" },
      { amount: "1 tsp", item: "sugar" },
      { amount: "1 tsp", item: "fine salt" },
      { amount: "175ml", item: "warm water" },
      { amount: "2 tbsp", item: "olive oil" },
      { amount: "200g", item: "San Marzano canned tomatoes, crushed by hand" },
      { amount: "200g", item: "fresh mozzarella, torn" },
      { amount: "1 handful", item: "fresh basil leaves" },
      { amount: "to taste", item: "flaky salt and olive oil to finish" },
    ],
    steps: [
      "Combine flour, yeast, sugar and salt. Add water and oil; mix to a shaggy dough. Knead 10 minutes until smooth and elastic. Place in an oiled bowl, cover and prove 1 hour until doubled.",
      "Preheat oven to its highest setting (250°C+). Place a heavy baking sheet or pizza stone in the oven to heat up.",
      "Divide dough in two. On a lightly floured surface, stretch or roll each ball into a thin 30cm circle.",
      "Season crushed tomatoes with a pinch of salt. Spread a thin layer over each base, leaving a 2cm border.",
      "Scatter torn mozzarella over the sauce.",
      "Carefully slide pizza onto the hot baking sheet. Bake 10–12 minutes until crust is puffed and charred in spots.",
      "Remove from oven. Top with fresh basil, a drizzle of olive oil and flaky salt. Serve immediately.",
    ],
    published: true,
  },
  {
    title: "Tropical Green Smoothie Bowl",
    slug: "tropical-green-smoothie-bowl",
    description:
      "A thick, vibrant smoothie bowl blending spinach, mango, banana and coconut milk, loaded with colourful toppings for the perfect nutritious start.",
    content: `Smoothie bowls are all about texture contrast — a thick, creamy base topped with crunchy granola, fresh fruit and seeds. The spinach turns the bowl a gorgeous green without adding any detectable flavour; all you'll taste is tropical sweetness. The trick is using frozen fruit so the base is thick enough to eat with a spoon rather than drink through a straw.`,
    image:
      "https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&q=80",
    category: "Breakfast",
    tags: ["smoothie", "healthy", "vegan", "tropical", "quick"],
    cookTime: "0 mins",
    prepTime: "10 mins",
    servings: 2,
    ingredients: [
      { amount: "2 large handfuls", item: "baby spinach" },
      { amount: "300g", item: "frozen mango chunks" },
      { amount: "2", item: "frozen bananas" },
      { amount: "200ml", item: "coconut milk" },
      { amount: "1 tbsp", item: "honey or agave (optional)" },
      { amount: "to top", item: "granola, fresh berries, banana slices" },
      { amount: "to top", item: "chia seeds, coconut flakes, mint leaves" },
    ],
    steps: [
      "Add spinach, frozen mango, frozen banana and coconut milk to a high-powered blender.",
      "Blend on high until completely smooth and thick. If too thick, add coconut milk 1 tablespoon at a time. Taste and sweeten if desired.",
      "Pour into two bowls — the mixture should be thick enough to support toppings.",
      "Arrange toppings decoratively: granola for crunch, fresh fruit for colour, seeds and coconut for texture.",
      "Serve immediately while the base is still cold and thick.",
    ],
    published: true,
  },
  {
    title: "Brown Butter Chocolate Chip Cookies",
    slug: "brown-butter-chocolate-chip-cookies",
    description:
      "Thick, gooey cookies with crispy edges and molten chocolate pockets — the secret is browned butter and a sprinkle of flaky sea salt on top.",
    content: `Browning the butter first takes these cookies from good to extraordinary. The nutty, caramel notes of browned butter transform the flavour profile entirely. Chilling the dough overnight (though optional) allows the flavours to develop and results in thicker, chewier cookies. Don't skip the flaky salt on top — it's the finishing touch that makes every bite sing.`,
    image:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80",
    category: "Dessert",
    tags: ["cookies", "chocolate", "baking", "dessert", "sweet"],
    cookTime: "14 mins",
    prepTime: "20 mins",
    servings: 24,
    ingredients: [
      { amount: "225g", item: "unsalted butter" },
      { amount: "200g", item: "light brown sugar, packed" },
      { amount: "100g", item: "granulated sugar" },
      { amount: "2", item: "large eggs" },
      { amount: "1 tbsp", item: "vanilla extract" },
      { amount: "280g", item: "plain flour" },
      { amount: "1 tsp", item: "bicarbonate of soda" },
      { amount: "1 tsp", item: "fine salt" },
      { amount: "300g", item: "dark chocolate chips or chopped chocolate" },
      { amount: "to finish", item: "flaky sea salt" },
    ],
    steps: [
      "Brown the butter: melt in a light-coloured pan over medium heat, swirling frequently, until golden brown and nutty-smelling (6–8 min). Pour into a large bowl immediately and cool 10 minutes.",
      "Whisk both sugars into the browned butter. Add eggs and vanilla; whisk vigorously for 2 minutes until thick and glossy.",
      "Fold in flour, bicarbonate of soda and salt until just combined. Fold in chocolate chips.",
      "Cover dough and refrigerate at least 1 hour (or overnight for best results).",
      "Preheat oven to 180°C. Line baking sheets with parchment.",
      "Scoop dough into balls (about 3 tbsp each). Place 5cm apart on sheets. Sprinkle with flaky salt.",
      "Bake 12–14 minutes until edges are set but centres look slightly underdone. Cool on pan 5 minutes before transferring.",
    ],
    published: true,
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find or use the first admin
    const admin = await Admin.findOne();
    if (!admin) {
      console.error(
        "❌ No admin found. Make sure the backend has been run at least once to seed the default admin."
      );
      process.exit(1);
    }

    console.log(`📝 Using admin: ${admin.username} (${admin._id})`);

    let created = 0;
    let skipped = 0;

    for (const recipeData of recipes) {
      const existing = await Recipe.findOne({ slug: recipeData.slug });
      if (existing) {
        console.log(`⏭️  Skipped (already exists): ${recipeData.title}`);
        skipped++;
        continue;
      }

      const recipe = new Recipe({
        ...recipeData,
        author: admin._id,
        authorName: admin.username,
      });

      await recipe.save();
      console.log(`✅ Created: ${recipe.title}`);
      created++;
    }

    console.log(`\n🎉 Seed complete! Created: ${created}, Skipped: ${skipped}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error.message);
    process.exit(1);
  }
}

seed();
