"use server";
import User from "@/Model/User";
import jwt from "jsonwebtoken";
import {
  getErrorResponseObject,
  getSuccessResponseObject,
  hash,
  verifyHash,
} from "../utils";
import { cookies } from "next/headers";
import { credentials } from "@/constants/credentials";

export const signIn = async (data: signInProps) => {
  try {
    if (!data.email || !data.password) {
      console.log("email and password are required");
      return;
    }
    let userDetails: any = await User.findOne({ email: data.email }).lean();
    if (!userDetails) {
      return getErrorResponseObject({
        message: "Could not find user with the email",
      });
    }
    if (!(await verifyHash(data.password, userDetails.password))) {
      return getErrorResponseObject({ message: "Invalid password" });
    }
    delete userDetails.password;
    if (!credentials.JWT_ACCESS_SECRET || !credentials.JWT_REFRESH_SECRET) {
      return getErrorResponseObject({
        message: "Internal server error",
      });
    }
    cookies().set(
      "access-token",
      jwt.sign(userDetails, credentials.JWT_ACCESS_SECRET, { expiresIn: "24h" })
    );
    cookies().set(
      "refresh-token",
      jwt.sign(userDetails, credentials.JWT_REFRESH_SECRET, {
        expiresIn: "10d",
      })
    );
    return getSuccessResponseObject({
      data: userDetails,
      message: "Logged in successfully",
    });
  } catch (error) {
    return getErrorResponseObject({ message: String(error) });
  }
};

export const signUp = async (data: SignUpParams) => {
  try {
    const finalData: any = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      address: data.address,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      dateOfBirth: data.dateOfBirth,
      ssn: data.ssn,
    };

    finalData.password = await hash(data.password);
    const res = await User.create(finalData);
    return getSuccessResponseObject({
      data: res,
      message: "Signed up successfully",
    });
  } catch (error) {
    return getErrorResponseObject({ message: String(error) });
  }
};

export const getDetailsFromToken = async () => {
  const accessToken = cookies().get("access-token");
  if (!accessToken) {
    return getErrorResponseObject({ message: "Unauthorized" });
  }
  if (!credentials.JWT_ACCESS_SECRET) {
    return getErrorResponseObject({
      message: "Internal server error",
    });
  }
  const decoded = jwt.verify(
    String(accessToken),
    credentials.JWT_ACCESS_SECRET
  );
  if (!decoded) {
    return getErrorResponseObject({
      message: "Token expired, please login again!",
      data: "TOKEN_EXPIRED",
    });
  }
  return getSuccessResponseObject({
    message: "Obtained details successfully",
    data: decoded,
  });
};

export const verifyWithRefreshToken = async () => {
  const refreshToken = cookies().get("refresh-token");
  if (!refreshToken) {
    return getErrorResponseObject({
      message: "Token expired, please login again!",
      data: "TOKEN_EXPIRED",
    });
  }
  if (!credentials.JWT_REFRESH_SECRET || !credentials.JWT_ACCESS_SECRET) {
    return getErrorResponseObject({
      message: "Internal server error",
    });
  }
  const decoded = jwt.verify(
    String(refreshToken),
    credentials.JWT_REFRESH_SECRET
  );
  if (!decoded) {
    return getErrorResponseObject({
      message: "Token expired, please login again!",
      data: "TOKEN_EXPIRED",
    });
  }
  cookies().set(
    "access-token",
    jwt.sign(decoded, credentials.JWT_ACCESS_SECRET, { expiresIn: "24h" })
  );
  cookies().set(
    "refresh-token",
    jwt.sign(decoded, credentials.JWT_REFRESH_SECRET, {
      expiresIn: "10d",
    })
  );
  return decoded;
};
