import prisma from '../database/prisma'

export async function getProducts() {
  return await prisma.product.findMany({
    include: {
      category: true,
    },
  })
}

export async function createProduct(data) {
  return await prisma.product.create({
    data,
  })
}

export async function deleteProduct(id) {
  return await prisma.product.delete({
    where: {
      id,
    },
  })
}