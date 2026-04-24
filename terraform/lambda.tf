locals {
  lambda_functions = {
    biddingDeadlineSoon = {
      handler = "biddingDeadlineSoon/index.handler"
      zip     = "${var.lambda_zip_path}/biddingDeadlineSoon.zip"
    }
    biddingDeadlinePassed = {
      handler = "biddingDeadlinePassed/index.handler"
      zip     = "${var.lambda_zip_path}/biddingDeadlinePassed.zip"
    }
    noAssignmentReminder = {
      handler = "noAssignmentReminder/index.handler"
      zip     = "${var.lambda_zip_path}/noAssignmentReminder.zip"
    }
    expiryWarning = {
      handler = "expiryWarning/index.handler"
      zip     = "${var.lambda_zip_path}/expiryWarning.zip"
    }
    shipmentExpired = {
      handler = "shipmentExpired/index.handler"
      zip     = "${var.lambda_zip_path}/shipmentExpired.zip"
    }
    pickupReminder = {
      handler = "pickupReminder/index.handler"
      zip     = "${var.lambda_zip_path}/pickupReminder.zip"
    }
    paymentReminder = {
      handler = "paymentReminder/index.handler"
      zip     = "${var.lambda_zip_path}/paymentReminder.zip"
    }
    ratingReminder = {
      handler = "ratingReminder/index.handler"
      zip     = "${var.lambda_zip_path}/ratingReminder.zip"
    }
  }

  # shared env vars for all lambdas
  lambda_env_vars = {
    MONGODB_URL       = var.mongo_uri
    DYNAMO_TABLE_NAME = var.dynamo_table_name
    EXPRESS_URL       = var.express_url
    INTERNAL_SECRET   = var.internal_secret
  }
}

resource "aws_lambda_function" "fleethub" {
  for_each = local.lambda_functions

  function_name = "fleethub-${each.key}"
  role          = aws_iam_role.lambda_role.arn
  handler       = each.value.handler
  runtime       = "nodejs22.x"
  timeout       = 30
  memory_size   = 256
  filename      = each.value.zip

  source_code_hash = filebase64sha256(each.value.zip)

  environment {
    variables = local.lambda_env_vars
  }

  tags = {
    Project = "FleetHub"
  }
}