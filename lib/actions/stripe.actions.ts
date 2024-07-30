"use server";
import { credentials } from "@/constants/credentials";
import stripe from "stripe";
import {
  getErrorResponseObject,
  getSuccessResponseObject,
  parseStringify,
} from "../utils";
const getEnvironment = (): "production" | "sandbox" => {
  const environment = credentials.STRIPE_ENVIRONMENT as string;

  switch (environment) {
    case "sandbox":
      return "sandbox";
    case "production":
      return "production";
    default:
      throw new Error(
        "Dwolla environment should either be set to `sandbox` or `production`"
      );
  }
};
const stripeClient = new stripe(credentials.STRIPE_SECRET_KEY!);

export const createStripeCustomer = async (data: {
  email: string;
  name: string;
}) => {
  try {
    const res = await stripeClient.customers.create(data);
    return getSuccessResponseObject({
      data: parseStringify(res),
      message: "Created stripe customer successfully",
    });
  } catch (error) {
    return getErrorResponseObject({ message: String(error) });
  }
};

export const verifyStripeCustomer = async ({
  stripeCustomerId,
  stripe_bank_account_token,
}: {
  stripeCustomerId: string;
  stripe_bank_account_token: string;
}) => {
  try {
    console.log(stripeCustomerId, stripe_bank_account_token, {
      amounts: [32, 45],
    });
    const res = await stripeClient.customers.verifySource(
      stripeCustomerId,
      stripe_bank_account_token,
      {
        amounts: [32, 45],
      }
    );
    return getSuccessResponseObject({
      data: parseStringify(res),
      message: "verified stripe customer source successfully",
    });
  } catch (error) {
    return getErrorResponseObject({ message: String(error) });
  }
};
export const createStripeSource = async ({
  stripeCustomerId,
  stripe_bank_account_token,
}: {
  stripeCustomerId: string;
  stripe_bank_account_token: string;
}) => {
  try {
    // Attach the bank account to the customer
    const res = await stripeClient.customers.createSource(stripeCustomerId, {
      source: stripe_bank_account_token,
    });

    return getSuccessResponseObject({
      data: parseStringify(res),
      message: "Created stripe customer source successfully",
    });
  } catch (error) {
    return getErrorResponseObject({ message: String(error) });
  }
};
export const createStripeTransaction = async ({
  customerId,
  currency,
  amount,
}: {
  amount: number;
  customerId: string;
  currency: string;
}) => {
  try {
    const res = await stripeClient.charges.create({
      amount,
      currency,
      customer: customerId,
    });
    return getSuccessResponseObject({
      data: parseStringify(res),
      message: "Created stripe transaction successfully",
    });
  } catch (error) {
    return getErrorResponseObject({ message: String(error) });
  }
};