import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { ILoginUser, IUser } from "../user/user.interface";
import { User } from "../user/user.model";
import { jwtHelper } from "../../../helpers/jwtHelper";
import config from "../../../config";
import { responseMessage } from "../../../constants/message";
import bcrypt from "bcrypt";
import crypto from "crypto"; 
import { EmailService } from "../../../shared/email";

const createUser = async (payload: IUser): Promise<IUser | null> => {
  try {
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    payload.email_verification_token = emailVerificationToken;

    const user = await User.create(payload);
    const verificationLink = `${config.domain}/verify-email?token=${emailVerificationToken}&email=${encodeURIComponent(payload.email)}`;
    await EmailService.VerificationEmailService.sendVerificationEmail(payload.email, verificationLink);

    return user;
  } catch (error) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      responseMessage.INTERNAL_SERVER_ERROR_MESSAGE
    );
  }
};

const verifyEmail = async (email: string): Promise<IUser | null> => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, responseMessage.USER_NOT_EXIST);
    }
    user.is_active = true;
    const data = await user.save();
    return data;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR_MESSAGE);
  }
};

const userLogin = async (payload: ILoginUser): Promise<string> => {
  const { email, password } = payload;
  try {
    const isExist = await User.findOne({ email });
    if (!isExist) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        responseMessage.USER_NOT_EXIST
      );
    }

      if (isExist.is_active!) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          responseMessage.EMAIL_NOT_VERIFIED
        );
      }

    const user = await User.findOne({ email }).select("+password");
    const isPasswordMatch = await user?.isPasswordMatched(
      password,
      user.password
    );
    if (!isPasswordMatch) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        responseMessage.INCORRECT_PASSWORD_MESSAGE
      );
    }
    const jwtPayload = {
      id: isExist?._id!,
      email: isExist?.email!,
    };
    const accessToken = jwtHelper.createToken(
      jwtPayload,
      config.jwt.secret!,
      config.jwt.expiresIn!
    );
    return accessToken;
  } catch (error) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      responseMessage.INTERNAL_SERVER_ERROR_MESSAGE
    );
  }
};

const forgetPassword = async (email: string) => {
  try {
    const isUserExist = await User.findOne({ email });
    if (!isUserExist) {
      return false;
    }
    const jwtPayload = {
      userId: isUserExist._id,
    };
    const token = jwtHelper.createToken(jwtPayload, config.jwt.secret!, "10m");
    const encodedEmail = encodeURIComponent(isUserExist.email);
    const encodedName = encodeURIComponent(isUserExist.name);
    const link = `${config.domain}/reset-password?token=${token}&userId=${isUserExist._id}&email=${encodedEmail}&name=${encodedName}`;
    const mailResult = await EmailService.ResetPasswordEmailService.sendResetPasswordLink(email, link);
    return { user: isUserExist, messageId: mailResult.messageId };
  } catch (error) {
    throw new Error(responseMessage.INTERNAL_SERVER_ERROR_MESSAGE);
  }
};

const resetPassword = async (userId: string, password: string) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    await User.findByIdAndUpdate(userId, {
      $set: { password: hashedPassword },
    });
  } catch (error) {
    throw new Error(responseMessage.INTERNAL_SERVER_ERROR_MESSAGE);
  }
};

const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string
) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return false;
    }
    const isPassMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isPassMatch) {
      return false;
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(userId, {
      $set: { password: hashedPassword },
    });
    return true;
  } catch (error) {
    throw new Error(responseMessage.INTERNAL_SERVER_ERROR_MESSAGE);
  }
};

export const AuthService = {
  createUser,
  userLogin,
  changePassword,
  resetPassword,
  forgetPassword,
  verifyEmail
};
