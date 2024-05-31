import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Configuration } from '@kibocommerce/rest-sdk';
import { OrderApi } from '@kibocommerce/rest-sdk/clients/Commerce'

export const main = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  const FILTER = createFilterString();

  const configuration = Configuration.fromEnv()
  const ordersResource = new OrderApi(configuration)

  try {

    const orders = await ordersResource.getOrders({ pageSize: 200, filter: FILTER, responseFields: 'items(id, orderNumber, siteId, tenantId)' });

    const cancelledOrders: string[] = [];

    if (orders.items) {
      for (let order of orders.items) {
        try {

          const orderId = order.id || '0'

          await ordersResource.performOrderAction({ orderId: orderId, orderAction: { actionName: "CancelOrder" } }, { headers: { "x-vol-site": `${order.siteId}` } });

          cancelledOrders.push(`${order.orderNumber}: ${order.id}`)

        } catch (e) {
          console.error(`COULD NOT CANCEL ORDER ${order.orderNumber}. ${e}`);
        }
      }
      console.log(`FILTER - ${FILTER} || CANCELLED ORDERS - ${JSON.stringify(cancelledOrders)}`);
    }
  } catch (e) {
    console.error(e)
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Function executed successfully!',
    }),
  };

};

const createFilterString = () => {
  return `auditInfo.updateDate le ${getModifiedTime()} and status ne Cancelled and paymentStatus ne Paid`;
}

const getModifiedTime = () => {
  const INTERVAL = process.env.ORDER_AUTO_CANCEL_AGE || 172800000; // default 2 days
  const currentTime = Date.now();
  const modifiedTime = currentTime - Number(INTERVAL);
  const isoTime = new Date(modifiedTime).toISOString();

  return isoTime;
}
