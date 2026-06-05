const { v4: uuidv4 } = require("uuid");

const SignatureLink = require("../models/SignatureLink");
const Document = require("../models/Document");

// Generate Public Link
exports.generateLink = async (req, res) => {
  try {
    const document = await Document.findById(
      req.params.id
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const token = uuidv4();

    const link =
      await SignatureLink.create({
        documentId: document._id,
        token,
        expiresAt: new Date(
          Date.now() +
            7 *
              24 *
              60 *
              60 *
              1000
        ),
      });

    const publicUrl =
      `http://localhost:5173/public-sign/${link.token}`;

    console.log(
      "\n========== MOCK EMAIL =========="
    );
    console.log(
      "To: signer@example.com"
    );
    console.log(
      "Subject: Document Signature Request"
    );
    console.log(
      "Please sign the document using this link:"
    );
    console.log(publicUrl);
    console.log(
      "================================\n"
    );

    res.status(201).json({
      success: true,
      token: link.token,
      publicUrl,
      emailMock: {
        to: "signer@example.com",
        subject:
          "Document Signature Request",
        link: publicUrl,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Validate Public Link
exports.validateLink = async (req, res) => {
  try {
    const { token } = req.params;

    const link =
      await SignatureLink.findOne({
        token,
      });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "Invalid link",
      });
    }

    if (
      new Date() > link.expiresAt
    ) {
      return res.status(400).json({
        success: false,
        message: "Link expired",
      });
    }

    const document =
      await Document.findById(
        link.documentId
      );

    if (!document) {
      return res.status(404).json({
        success: false,
        message:
          "Document not found",
      });
    }

    res.status(200).json({
      success: true,
      document,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};