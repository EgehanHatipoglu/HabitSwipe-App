/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Main.java to edit this template
 */
package fileoopexam;

import java.io.File;
import java.io.FileWriter;
import java.util.Scanner;

/**
 *
     * 
     * git clone from sıte
     * init git reepository 
     * add
     * commit   (böylece local repository oluşturduk )
     * remote push
     *  access token 
     * create branch 
     * 
     * 
     * 
     * 
     * 
     * 
     * 
     *   java belli durumlarda try catch kullanmadan belli bir dosya oluşturulmasına  bazı dosya işlemlerine izin vermez.
     *   javada exception bir veri tipidir.
 * @author egehanhatipoglu
 */
public class FileOopExam {

    
    public static void main(String[] args) {
      
        User user= new User("10","20","egehan","hatipoglu","17/03/2003","","","");
        
        
        try{
              File file= new File("Text.txt");
              
              if(!file.createNewFile()) {
                  file.createNewFile();
                                     System.out.println("dosya oluştruldu");
              }
                           
             
              FileWriter fileWriter = new FileWriter("Text.txt");
              
               fileWriter.write(user.getName() + "\n");
               
              fileWriter.write(user.getPhoneNumber()+"\n" );
               
              fileWriter.write(user.getId()+ "\n"   );
             fileWriter.write(user.getEmail()+ "\n" );
                fileWriter.write(user.getSurname()  + "\n");
              
                System.out.println("yazma işlemi tamamlandı ");
              fileWriter.close();
              
              
              
              
              Scanner read= new Scanner(file);
              
              
              while(read.hasNextLine()){
                                          
                  System.out.println(read.nextLine());
                  
                  
              }
              
              while(read.hasNextInt()) {
                  System.out.println(read.nextInt());
              }
                  
                  
                  
                  
               System.out.println("okuma işlemi tamamlandı");
              read.close();
              
              
              
              
        }
                
        
        
        catch(Exception e){
                         System.out.println(e.getMessage());
                         
        }
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
    }
    
    
    
    
    
    
    
    
    
}
