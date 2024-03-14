const express = require("express");
const path = require("path");
const { upload } = require("../multer");
const fs = require('fs').promises;
const User = require("../Model/user");
const ErrorHandler = require("../utils/ErrorHandler");
const router = express.Router()
const bcrypt = require("bcrypt")
const catchAsyncErrors = require("../middlewares/catchAsyncErrors")
const { PDFDocument } = require('pdf-lib')



//SignUp
router.post("/create-user",catchAsyncErrors( async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password || name === ' ' || email === ' ' || password === ' ') {
      return next(new ErrorHandler("All fields required", 400))
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return next(new ErrorHandler("User Already Exist", 400))
    }

    const hashPassword = bcrypt.hashSync(password, 10)

    const user = await User.create({
      name,
      email,
      password: hashPassword
    })

    res.status(200).json(user)

  } catch (err) {
    return next(new ErrorHandler(err.message, 500))
  }
}));



//Login
router.post("/login-user", catchAsyncErrors(async (req, res, next) => {
  try {

    const { email, password } = req.body;

    if (!email || !password || email === '' || password === '') {
      return next(new ErrorHandler("Please provide all required fields", 400))
    }

    const user = await User.findOne({ email });
    if (!user) {
      return next(new ErrorHandler("Invalid credentials", 400))
    }
    const validPassword = bcrypt.compare(password, user.password)
    if (!validPassword) {
      return next(new ErrorHandler('Invalid credentials', 400))
    }

    res.status(200).json(user)

  } catch (error) {
    return next(new ErrorHandler(error.message, 500))
  }

}))

//get user (PDFs are stored in the User model,so we can get the PDFs by this get request )

router.get('/getUser/:id', catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById({ _id: id })
    if (!user) {
      return next(new ErrorHandler("user not found", 400))
    }
    res.status(200).json(user)

  } catch (err) {
    return next(new ErrorHandler(err.message, 500))
  }
}))





//To upload PDF
router.post('/add/:id', upload.single("file"), async (req, res, next) => {
  try {
    const { title } = req.body
    const filename = req.file.filename
    const fileUrl = path.join(filename)

    console.log(fileUrl)

    const user = await User.findById({ _id: req.params.id })

    if (!user) {
      return next(new ErrorHandler("user not found", 400))
    }

    user.pdf.push({
      title: title,
      PDFdata: fileUrl
    })
    await user.save()

    res.status(200).json({ message: 'PDF added successfully', user });

  } catch (err) {
    return next(new ErrorHandler(err.message, 500))
  }
})



//To extract new pdf

router.post('/extract/:id/:pdfId', catchAsyncErrors(async (req, res, next) => {
  try {
    const { id, pdfId } = req.params;
    const { pagesToExtract } = req.body;
    const user = await User.findById({ _id: id });

    if (!user) {
      return next(new ErrorHandler("User not found", 400));
    }

    const pdf = user.pdf.find(pdf => pdf._id == pdfId);
    const pdfPath = `uploads/${pdf.PDFdata}`

    if (!pdf) {
      return next(new ErrorHandler("PDF not found", 400));
    }

    const pages = pagesToExtract;
    const originalPdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(originalPdfBytes)
    const extractedPdf = await PDFDocument.create()
    const copiedPage = await extractedPdf.copyPages(pdfDoc, pages)
    copiedPage.forEach((page) => extractedPdf.addPage(page))
    const newPdfBytes = await extractedPdf.save()
    const buf = Buffer.from(newPdfBytes)
    const base64Data = buf.toString('base64')
    const json = { data: base64Data }
    const jsonString = JSON.stringify(json)
    const outputPath = `uploads/extracted_${Date.now()}.pdf`;
    const filePath = outputPath.split("/")[1]
    await fs.writeFile(outputPath, newPdfBytes);
    user.pdf.push({
      title: `${pdf.title}_extracted_${Date.now()}`,
      PDFdata: filePath
    })
    await user.save()
    console.log(`PDF saved to: ${outputPath}`);
    res.status(200).send({ success: true, filePath: outputPath });

  } catch (err) {
    return next(new ErrorHandler(err.message, 500))
  }
}));


//To delete PDF

router.delete('/delete/:id/:pdfId', catchAsyncErrors(async (req, res, next) => {
  try {
    const { id, pdfId } = req.params;
    const user = await User.findById({ _id: id });

    if (!user) {
      return next(new ErrorHandler("User not found", 400));
    }
    const pdfIndexToDelete = user.pdf.findIndex(pdf => pdf._id == pdfId);
    if (pdfIndexToDelete === -1) {
      return next(new ErrorHandler("PDF not found", 400));
    }
    user.pdf.splice(pdfIndexToDelete, 1);
    await user.save();
    res.status(200).json(user);
  } catch (err) {
    return next(new ErrorHandler(err.message, 500));
  }
}));


module.exports = router