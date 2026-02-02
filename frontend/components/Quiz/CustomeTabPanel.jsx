function CustomTabPanel(props) {
  const { children, value, index,flex, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      className={`h-full ${flex ? 'flex-1' : ''}`}
    >
      {value === index && <div className="h-full">{children}</div>}
    </div>
  );
}

export default CustomTabPanel