
const crypto = require('crypto');
const axios = require('axios');

async function getEsewaPaymentHash({ amount, transaction_uuid }) {
  const data = `total_amount=${amount},transaction_uuid=${transaction_uuid},product_code=${process.env.ESEWA_PRODUCT_CODE}`;
  const secretKey = process.env.ESEWA_SECRET_KEY;
  const hash = crypto.createHmac("sha256", secretKey).update(data).digest("base64");

  return {
    signature: hash,
    signed_field_names: "total_amount,transaction_uuid,product_code",
  };
}

async function verifyEsewaPayment(encodedData) {
  const decodedData = JSON.parse(Buffer.from(encodedData, 'base64').toString());
  const data = `transaction_code=${decodedData.transaction_code},status=${decodedData.status},total_amount=${decodedData.total_amount},transaction_uuid=${decodedData.transaction_uuid},product_code=${process.env.ESEWA_PRODUCT_CODE},signed_field_names=${decodedData.signed_field_names}`;
  const secretKey = process.env.ESEWA_SECRET_KEY;
  const hash = crypto.createHmac("sha256", secretKey).update(data).digest("base64");

  if (hash !== decodedData.signature) {
    throw new Error('Invalid signature');
  }

  const response = await axios.get(`${process.env.ESEWA_GATEWAY_URL}/api/epay/transaction/status/?product_code=${process.env.ESEWA_PRODUCT_CODE}&total_amount=${decodedData.total_amount}&transaction_uuid=${decodedData.transaction_uuid}`);

  if (response.data.status !== "COMPLETE" || response.data.transaction_uuid !== decodedData.transaction_uuid || Number(response.data.total_amount) !== Number(decodedData.total_amount)) {
    throw new Error('Invalid payment data');
  }

  return { response: response.data, decodedData };
}

module.exports = { verifyEsewaPayment, getEsewaPaymentHash };