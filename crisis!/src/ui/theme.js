import { TextStyle } from "pixi.js";

export const COLORS = {
  bg: 0xE4DFD2,        
  primary: 0xE37B40,    
  text: 0xE37B40,       
  textDark: 0x2c3e50,  
  panel: 0xFFFFFF
};

export const STYLES = {
  header: new TextStyle({
    fontFamily: "Poppins, sans-serif", 
    fontSize: 64,
    fill: COLORS.primary,
    fontWeight: "900",
    align: "center",
    letterSpacing: -1  
  }),
  
  label: new TextStyle({
    fontFamily: "Poppins, sans-serif",
    fontSize: 24,
    fill: COLORS.primary,
    fontWeight: "600", 
    align: "center"
  }),

  body: new TextStyle({
    fontFamily: "Poppins, sans-serif",
    fontSize: 20,
    fill: COLORS.textDark, 
    fontWeight: "400",    
    wordWrap: true,
    wordWrapWidth: 600,
    lineHeight: 32        
  })
};