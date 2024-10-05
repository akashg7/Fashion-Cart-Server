const { PrismaClient } = require('@prisma/client');
const Jdata = require('./db.json')
// console.log(data , "hello")
const prisma = new PrismaClient();

async function main() {
    for (let i = 0; i < Jdata.length ; i++){
        const product1 = await prisma.products.create({
            data : Jdata[i]
        });
        // console.log('Created product:', product1);
    }
}

// main()
//   .catch(e => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });


// async function main() {
//   // Replace this with the user input data
//   const userData = [
//     {
//       name: 'John Doe',
//       email: 'john.doe@example.com',
//       password: 'password123',
//     },
//     {
//       name: 'Jane Smith',
//       email: 'jane.smith@example.com',
//       password: 'password456',
//     },
//   ];

//   for (const user of userData) {
//     await prisma.user.create({
//       data: user,
//     });
//   }

//   console.log('User data seeded successfully!');
// }

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });