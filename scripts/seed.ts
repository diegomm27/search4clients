import { prisma } from "@/lib/storage/prisma";

async function main() {
  console.log("Seed requires config/candidates.json to exist.");
  console.log("This feature is not active since sample data was removed.");
  console.log("Use the primary /search4clients scan workflow instead.");
  process.exit(1);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
