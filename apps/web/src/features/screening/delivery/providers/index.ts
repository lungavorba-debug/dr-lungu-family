import type { DeliveryChannel, DeliveryProvider } from '../types/delivery.types';

import { downloadPdfProvider } from './download-pdf.provider';

import { emailDeliveryProvider } from './email-delivery.provider';

import { printDeliveryProvider } from './print-delivery.provider';

import { whatsappDeliveryProvider } from './whatsapp-delivery.provider';



export const DELIVERY_PROVIDERS: DeliveryProvider[] = [

  emailDeliveryProvider,

  whatsappDeliveryProvider,

  printDeliveryProvider,

  downloadPdfProvider,

];



export function getVisibleDeliveryProviders(): DeliveryProvider[] {

  return DELIVERY_PROVIDERS;

}



export function getDeliveryProvider(channel: DeliveryChannel): DeliveryProvider | undefined {

  return DELIVERY_PROVIDERS.find((provider) => provider.channel === channel);

}



export {

  downloadPdfProvider,

  whatsappDeliveryProvider,

  emailDeliveryProvider,

  printDeliveryProvider,

};


