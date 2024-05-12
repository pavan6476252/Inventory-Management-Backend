import express from "express";
import CompanyModel from "../models/company_model.js";
import { isAuthenticated } from "../middlewares/user_auth.js";

const companyRouter = express.Router();

companyRouter.get("/", async (req, res) => {
  const locations = await CompanyModel.find()
  .populate("createdBy")
  .populate("editedBy");

  return res.status(200).json(locations || []);
});
companyRouter.get("/:id", async (req, res) => {
  const locations = await CompanyModel.findById(req.params.id)
    .populate("createdBy")
    .populate("editedBy");

  return res.status(200).json(locations);
});

companyRouter.patch("/:id", isAuthenticated, async (req, res) => {
  const { name, description } = req.body;
  const editedBy = req.user._id;

  await CompanyModel.findByIdAndUpdate(req.params.id, {
    $set: {
      name,
      description,
      editedBy,
    },
  });

  return res.status(200).json({ message: "Success" });
});

companyRouter.post("/", isAuthenticated, async (req, res) => {
  const { name, description } = req.body;
  const user_id = req.user._id;

  const location = new CompanyModel({
    createdBy: user_id,
    name,
    description,
  });

  await location.save();
  return res.status(200).json({ message: "Success" });
});

export default companyRouter;
