resource "aws_scheduler_schedule" "fleethub" {
  for_each = local.lambda_functions

  name                         = "fleethub-${each.key}"
  schedule_expression          = "cron(0 * * * ? *)" 
  schedule_expression_timezone = "Asia/Kolkata"       

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_lambda_function.fleethub[each.key].arn
    role_arn = aws_iam_role.scheduler_role.arn

    input = jsonencode({})
  }
}