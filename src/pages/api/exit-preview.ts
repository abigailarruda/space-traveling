const exit_preview = async (_, res) => {
  res.clearPreviewData();

  res.writeHead(307, { Location: '/' });
  res.end();
};

export default exit_preview;
