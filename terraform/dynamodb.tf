resource "aws_dynamodb_table" "notifications" {
  name         = var.dynamo_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "notifId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "notifId"
    type = "S"
  }

  attribute {
    name = "shipmentId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "N"
  }

  global_secondary_index {
    name            = "shipmentId-createdAt-index"
    hash_key        = "shipmentId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Project = "FleetHub"
  }
}