output "dynamodb_table_name" {
  value = aws_dynamodb_table.notifications.name
}

output "lambda_function_arns" {
  value = {
    for k, v in aws_lambda_function.fleethub : k => v.arn
  }
}

output "lambda_role_arn" {
  value = aws_iam_role.lambda_role.arn
}