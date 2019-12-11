import tl = require("azure-pipelines-task-lib/task");
import { ReportConfiguration } from "./config/ReportConfiguration";
import { ConfigurationProvider } from "./config/ConfigurationProvider";
import { ReportManager } from "./ReportManager";
import { ReportProvider } from "./providers/ReportProvider";
import { DataProviderFactory } from "./providers/DataProviderFactory";
import { HTMLReportCreator } from "./htmlreport/HTMLReportCreator";
import { EmailSender } from "./EmailSender";
import { ReportError } from "./exceptions/ReportError";

async function run(): Promise<void> {
  try {
    const configProvider = new ConfigurationProvider();
    const reportConfiguration = new ReportConfiguration(configProvider);
    const reportProvider = new ReportProvider(new DataProviderFactory(configProvider.getPipelineConfiguration()));

    const reportManager = new ReportManager(
      reportProvider,
      new HTMLReportCreator(),
      new EmailSender());

    const mailSent = await reportManager.sendReportAsync(reportConfiguration);
    console.log("Email Task processing complete. Setting EmailReportTask.EmailSent Variable value.");   
    // Wait for 10 sec and timeout
    let val = await Promise.race([sleep(10000), setEmailSentVariable()]);
    if(!val) {
      console.log("Unable to set variable value in 10 sec. Exiting task.");
    }
  }
  catch (err) {
    if (err instanceof ReportError) {
      console.log(err.getMessage());
    }
    // Fail task
    throw err;
  }
}

function sleep(ms: number): Promise<boolean> {
  return new Promise(resolve => setTimeout(resolve, ms, false));
}

async function setEmailSentVariable() : Promise<boolean> {
  console.log(`##vso[task.setvariable variable=EmailReportTask.EmailSent;]false`);
  return true;
}

run();