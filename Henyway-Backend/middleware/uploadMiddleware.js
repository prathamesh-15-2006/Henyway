import multer from "multer";
import path from "path";

// Set up storage engine for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // The folder where images will be stored
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // Create a unique filename to avoid conflicts
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Function to filter files, allowing only images
const checkFileType = (file, cb) => {
  // Allowed file extensions
  const filetypes = /jpeg|jpg|png|gif/;
  // Check the extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check the mime type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Error: Images Only!"));
  }
};

// Initialize upload variable
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
});

export default upload;