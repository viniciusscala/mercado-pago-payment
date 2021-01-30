/* eslint-disable no-undef */
// require('dotenv').config();
// REPLACE WITH YOUR PUBLIC KEY AVAILABLE IN: https://developers.mercadopago.com/panel/credentials
window.Mercadopago.setPublishableKey('TEST-29471938-5802-4c04-8033-920471d67e5d');

window.Mercadopago.getIdentificationTypes();

document.getElementById('cardNumber').addEventListener('change', guessPaymentMethod);
function guessPaymentMethod(event) {
  cleanCardInfo();

  const cardnumber = document.getElementById('cardNumber').value;
  if (cardnumber.length >= 6) {
    const bin = cardnumber.substring(0, 6);
    window.Mercadopago.getPaymentMethod({
      bin,
    }, setPaymentMethod);
  }
}

function setPaymentMethod(status, response) {
  if (status == 200) {
    const paymentMethod = response[0];

    document.getElementById('paymentMethodId').value = paymentMethod.id;
    document.getElementById('cardNumber').style.backgroundImage = `url(${paymentMethod.thumbnail})`;

    if (paymentMethod.additional_info_needed.includes('issuer_id')) {
      getIssuers(paymentMethod.id);
    } else {
      document.getElementById('issuerInput').classList.add('hidden');

      getInstallments(
        paymentMethod.id,
        document.getElementById('amount').value,
      );
    }
  } else {
    alert(`payment method info error: ${response}`);
  }
}

function getIssuers(paymentMethodId) {
  window.Mercadopago.getIssuers(
    paymentMethodId,
    setIssuers,
  );
}

function setIssuers(status, response) {
  if (status == 200) {
    const issuerSelect = document.getElementById('issuer');

    response.forEach((issuer) => {
      const opt = document.createElement('option');
      opt.text = issuer.name;
      opt.value = issuer.id;
      issuerSelect.appendChild(opt);
    });

    if (issuerSelect.options.length <= 1) {
      document.getElementById('issuerInput').classList.add('hidden');
    } else {
      document.getElementById('issuerInput').classList.remove('hidden');
    }

    getInstallments(
      document.getElementById('paymentMethodId').value,
      document.getElementById('amount').value,
      issuerSelect.value,
    );
  } else {
    alert(`issuers method info error: ${response}`);
  }
}

function getInstallments(paymentMethodId, amount, issuerId) {
  window.Mercadopago.getInstallments({
    payment_method_id: paymentMethodId,
    amount: parseFloat(amount),
    issuer_id: issuerId ? parseInt(issuerId) : undefined,
  }, setInstallments);
}

function setInstallments(status, response) {
  if (status == 200) {
    document.getElementById('installments').options.length = 0;
    response[0].payer_costs.forEach((payerCost) => {
      const opt = document.createElement('option');
      opt.text = payerCost.recommended_message;
      opt.value = payerCost.installments;
      document.getElementById('installments').appendChild(opt);
    });
  } else {
    alert(`installments method info error: ${response}`);
  }
}

// Update offered installments when issuer changes
document.getElementById('issuer').addEventListener('change', updateInstallmentsForIssuer);
function updateInstallmentsForIssuer(event) {
  window.Mercadopago.getInstallments({
    payment_method_id: document.getElementById('paymentMethodId').value,
    amount: parseFloat(document.getElementById('amount').value),
    issuer_id: parseInt(document.getElementById('issuer').value),
  }, setInstallments);
}

// Proceed with payment
doSubmit = false;
document.getElementById('paymentForm').addEventListener('submit', getCardToken);
function getCardToken(event) {
  event.preventDefault();
  if (!doSubmit) {
    const $form = document.getElementById('paymentForm');
    window.Mercadopago.createToken($form, setCardTokenAndPay);

    return false;
  }
}

function setCardTokenAndPay(status, response) {
  if (status == 200 || status == 201) {
    const form = document.getElementById('paymentForm');
    const card = document.createElement('input');
    card.setAttribute('name', 'token');
    card.setAttribute('type', 'hidden');
    card.setAttribute('value', response.id);
    token = response.id;
    console.log('token', response.id);
    form.appendChild(card);
    doSubmit = true;
    form.submit(); // Submit form data to your backend
  } else {
    alert(`Verify filled data!\n${JSON.stringify(response, null, 4)}`);
  }
}

/** *
 * UX functions
 */

function cleanCardInfo() {
  document.getElementById('cardNumber').style.backgroundImage = '';
  document.getElementById('issuerInput').classList.add('hidden');
  document.getElementById('issuer').options.length = 0;
  document.getElementById('installments').options.length = 0;
}

// Handle transitions
document.getElementById('checkout-btn').addEventListener('click', () => {
  $('.shopping-cart').fadeOut(500);
  setTimeout(() => { $('.container_payment').show(500).fadeIn(); }, 500);
});
document.getElementById('go-back').addEventListener('click', () => {
  $('.container_payment').fadeOut(500);
  setTimeout(() => { $('.shopping-cart').show(500).fadeIn(); }, 500);
});

// Handle price update
function updatePrice() {
  const quantity = document.getElementById('quantity').value;
  const unitPrice = document.getElementById('unit-price').innerHTML;
  const amount = parseInt(unitPrice) * parseInt(quantity);

  document.getElementById('cart-total').innerHTML = `R$ ${amount}`;
  document.getElementById('summary-price').innerHTML = `R$ ${unitPrice}`;
  document.getElementById('summary-quantity').innerHTML = quantity;
  document.getElementById('summary-total').innerHTML = `R$ ${amount}`;
  document.getElementById('amount').value = amount;
}
document.getElementById('quantity').addEventListener('change', updatePrice);
updatePrice();

// Retrieve product description
document.getElementById('description').value = document.getElementById('product-description').innerHTML;
