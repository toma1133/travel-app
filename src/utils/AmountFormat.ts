const AmountFormat = (num) =>
    num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export default AmountFormat;
