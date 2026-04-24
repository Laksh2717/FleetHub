variable "aws_region" {
  description = "AWS region"
  default     = "ap-south-1"
}

variable "mongo_uri" {
  description = "MongoDB connection string"
  sensitive   = true
}

variable "dynamo_table_name" {
  description = "DynamoDB table name"
  default     = "Notifications"
}

variable "express_url" {
  description = "Express backend URL for SSE bridge"
  sensitive   = true
}

variable "internal_secret" {
  description = "Internal secret for SSE bridge"
  sensitive   = true
}

variable "lambda_zip_path" {
  description = "Path to lambda zip files"
  default     = "../backend/src/lambdas"
}