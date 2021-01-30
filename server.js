const express = require('express');

const app = express();
const mercadopago = require('mercadopago');
require('dotenv').config();

// REPLACE WITH YOUR ACCESS TOKEN AVAILABLE IN: https://developers.mercadopago.com/panel/credentials
mercadopago.configurations.setAccessToken(process.env.ACCESS_TOKEN);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('./client'));

app.get('/', (req, res) => {
  res.status(200).sendFile('index.html');
});

app.post('/process_payment', (req, res) => {
  const paymentData = {
    transaction_amount: Number(req.body.transactionAmount),
    token: req.body.token,
    description: req.body.description,
    installments: Number(req.body.installments),
    payment_method_id: req.body.paymentMethodId,
    issuer_id: req.body.issuer,
    payer: {
      email: req.body.email,
      identification: {
        type: req.body.docType,
        number: req.body.docNumber,
      },
    },
  };

  mercadopago.payment.save(paymentData)
    .then((response) => {
      res.status(response.status).json({
        status: response.body.status,
        status_detail: response.body.status_detail,
        id: response.body.id,
      });
    })
    .catch((error) => {
      res.send(error);
    });
});

app.post('/customer', (req, res) => {
  const customerData = { email: req.body.email };

  mercadopago.customers.create(customerData).then((customer) => {
    const cardData = {
      token: req.body.token,
      customer_id: customer.body.id,
    };

    mercadopago.card.create(cardData).then((card) => {
      res.json(customer);
    });
  });
});

app.get('/customer', (req, res) => {
  mercadopago.customers.search().then((customer) => {
    res.json(customer.body.results);
  });
});

app.delete('/customer', (req, res) => {
  mercadopago.customers.remove(req.body.id);
  mercadopago.customers.search().then((customer) => {
    res.json(customer.body.results);
  });
});

app.listen(8080, () => {
  console.log('The server is now running on Port 8080');
});
