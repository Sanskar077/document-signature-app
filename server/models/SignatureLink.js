const mongoose = require("mongoose");

const signatureLinkSchema =
  new mongoose.Schema(
    {
      documentId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Document",
        required: true,
      },

      token: {
        type: String,
        required: true,
        unique: true,
      },

      expiresAt: {
        type: Date,
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "SignatureLink",
    signatureLinkSchema
  );