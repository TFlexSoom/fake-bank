import { IRouterHandler } from "express";

export default function authentication(modules): IRouterHandler<void> {
    return (req, res, next) => {
        next();
    }
}