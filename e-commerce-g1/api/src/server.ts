import { PrismaClient, Prisma } from '@prisma/client';
import 'dotenv/config';
import express from 'express';

// 1. Criar a aplicação
const app = express();

// 6. Criando middewares para tratar requisições
app.use(express.json());

// 5. Configurar prisma
const prisma = new PrismaClient();

// 2. Definir a Porta
const PORT = 3000;

// 4. Declarar as rotas da api
app.get('/', (req, res) => {
    res.send(' + Fiat Lux! + ');
});

// >>> CRUD - PRODUCTS <<<
app.get('/products', async (req, res) => {

    try {
        const products = await prisma.product.findMany();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({
            status: "Houve um erro ao tentar buscar todos os produtos",
            error_details: `${error}` 
        })
    }

});

app.get('/products/:id', async (req, res) => {

    const { id } = req.params;

    try {
        
        const product = await prisma.product.findUnique({
            where: {
                id: id,
            },
        });
        
        if (product === null) {
            res.status(404).json({
                message: `Produto de id ${id} não encontrado!`
            });
        } else {
            res.status(200).json(product);
        }
        
    } catch (error) {
        
        res.status(500).json({
            status: "Houve um erro ao tentar buscar o produto",
            error_details: `${error}` 
        });

    }

});

app.post('/products', async (req, res) => {
   
    // Pegando os dados do corpo da requisição
    const { name, price, stock } = req.body;

    try {

        // Passando os valores para o Prisma
        const newProduct = await prisma.product.create({
            data: {
                name: name,
                price: price,
                stock: stock,
            },
        });

        // Retornando a respota com 201 (padrão para uma requisição POST bem-sucedida)
        res.status(201).json(newProduct);

    } catch (error) {
        res.status(500).json({
            status: "Houve um erro ao tentar salvar o novo produto.",
            error_details: `${error}` 
        })
    }
    

});

app.put('/products/:id', async (req, res) => {
   
    const { id } = req.params;
    const { name, price, stock } = req.body;

    try {

        const changedProduct = await prisma.product.update({
            where: {
                id: id,
            },
            data: {
                name: name,
                price: price,
                stock: stock,
            },
        });
        res.status(200).json(changedProduct);

    } catch (error) {
        
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
            res.status(404).json({
                message: `Produto de id ${id} não encontrado!`
            });
        }
        } else {
            res.status(500).json({
                status: "Houve um erro ao tentar salvar as alterações do produto.",
                error_details: `${error}` 
            });
        }
    
    }
    
});


app.delete('/products/:id', async (req, res) => {

    const { id } = req.params;

    try {
        
        const deletedProduct = await prisma.product.delete({
            where: {
                id: id,
            }
        });

        return res.status(204).send();

    } catch (error) {
       
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                res.status(404).json({
                    message: `Produto de id ${id} não encontrado!`
                });
            };
        } else {
            res.status(500).json({
                status: "Houve um erro ao tentar salvar as alterações do produto.",
                error_details: `${error}`
            });
        };
    };
});

// >>> CRUD - ORDERS <<<
app.get('/orders', async (req, res) => {
    
    try {
        const orders = await prisma.order.findMany({
            // Inclua as linhas da tabela OrderProduct
            include: {
                orderProducts: {
                    include: {
                        product: true
                    }
                }
            }
        });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({
            message: "Houve um erro ao tentar buscar todos os pedidos.",
            error_details: `${error}`
        })
    }
});

app.get('/orders/:id', async (req, res) => {

    const { id } = req.params;

    try {
        const order = await prisma.order.findUnique({
            where: {
                id: id,
            },
        });

        if (order === null) {
            res.status(404).json({
                message: `Produto de id ${id} não encontrado!`
            });
        } else {
            res.status(200).json(order);
        }

    } catch (error) {

        res.status(500).json({
            status: "Houve um erro ao tentar buscar o pedido",
            error_details: `${error}` 
        });

    }

})

app.post('/orders', async (req, res) => {

    const { products } = req.body;

    try {

        const productsWithFullInfo = [];
        let totalValue = 0;

        // Verifica se cada produto existe e possuí quantidade suficiente no estoque
        for (const product of products) {
            const productInDb = await prisma.product.findUnique({
                where: { id: product.productId }
            }); 

            if (productInDb === null) {
                return res.status(404).json({
                    message: `Produto de id ${product.productId} não encontrado!`
                });
            } else {
                if (product.quantity > productInDb?.stock) {
                    return res.status(400).json({
                        message: `Estoque insuficiente para o produto "${productInDb.name}". Pedido: ${product.quantity}, Estoque: ${productInDb.stock}`,
                    });
                };
            };

            // Se a validação passar, guardamos as informações
            productsWithFullInfo.push({
            ...productInDb,
            quantity: product.quantity,
            });

        };

        // Calcular totalValue
        productsWithFullInfo.forEach(product => totalValue += (product.price.toNumber() * product.quantity));

        // Salvar novo pedido
        const newOrder = await prisma.$transaction(async (tx) => {
            // 1. Criar a Ordem e as OrderProducts de uma vez
            const order = await tx.order.create({
                data: {
                    total_value: totalValue, // O valor total que calculamos
                    orderProducts: {
                        create: productsWithFullInfo.map(product => ({ // Usamos .map para transformar o array
                            productId: product.id,
                            quantity: product.quantity,
                            unit_value: product.price, // O preço do produto na hora da compra
                            total_value: (product.price.toNumber() * product.quantity), 
                        })),
                    },
                },
                include: { // Incluímos para a resposta ser completa
                    orderProducts: {
                        include: {
                            product: true,
                        },
                    },
                },
            });

            // 2. Atualizar o estoque de cada produto
            for (const product of productsWithFullInfo) {
                await tx.product.update({
                    where: { id: product.id },
                    data: {
                        stock: {
                            decrement: product.quantity // Diminui o estoque
                        },
                    },
                });
            }

            return order;
        });

        return res.status(201).json(newOrder);

    } catch (error) {

        res.status(500).json({
            status: "Houve um erro ao tentar salvar o novo pedido.",
            error_details: `${error}` 
        });

    };

});

// 3. Comando para aplicação começar a ouvir por req na porta `PORT`
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}!`);
});
