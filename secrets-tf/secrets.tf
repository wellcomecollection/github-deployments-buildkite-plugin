resource "aws_secretsmanager_secret" "weco_app_secrets" {
  for_each = toset(["id", "private_key"])
  name     = "github/weco_app/${each.value}"
}

data "aws_iam_policy_document" "secrets_access" {
  statement {
    sid     = "GithubAppSecretsAccess"
    actions = ["secretsmanager:GetSecretValue"]

    resources = [
      for key, _ in aws_secretsmanager_secret.weco_app_secrets :
      aws_secretsmanager_secret.weco_app_secrets[key].arn
    ]
  }
}
